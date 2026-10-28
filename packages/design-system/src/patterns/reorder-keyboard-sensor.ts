import {
  KeyboardSensor,
  type SensorProps,
  type Activators,
  type KeyboardSensorOptions,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";

/**
 * The stock sensor listens after bubbling. Modal/composite surfaces intentionally stop arrow
 * keys there. Capture only during an active drag, so a nested reorder owns its arrows/Escape
 * before a parent dialog; ordinary navigation and text entry never pass through this sensor.
 */
type ReorderKeyboardOptions = KeyboardSensorOptions & {
  register: (dispose: () => void, cancel: () => void) => () => void;
};
export class ReorderKeyboardSensor {
  static activators: Activators<ReorderKeyboardOptions> = KeyboardSensor.activators.map(
    (activator) => ({
      ...activator,
      handler: (...args: Parameters<typeof activator.handler>) => {
        const event = args[0].nativeEvent;
        if (event.isComposing || event.repeat || event.keyCode === 229) return false;
        return activator.handler(...args);
      },
    }),
  );
  // Keyboard movement scrolls one target at a time; pointer proximity scrolling would
  // keep moving after the user releases an arrow.
  autoScrollEnabled = false;
  private readonly document: Document;
  private readonly window: Window | null;
  private reference: { x: number; y: number } | null = null;
  private finished = false;
  private unregister: (() => void) | undefined;
  constructor(private readonly props: SensorProps<ReorderKeyboardOptions>) {
    this.document = (props.event.target as HTMLElement).ownerDocument;
    this.window = this.document.defaultView;
    props.activeNode.node.current?.scrollIntoView({
      block: "nearest",
      inline: "nearest",
      behavior: "instant",
    });
    props.onStart({ x: 0, y: 0 });
    this.document.addEventListener("keydown", this.onKeyDown, true);
    this.document.addEventListener("focusin", this.onFocus, true);
    this.window?.addEventListener("resize", this.cancel);
    this.window?.addEventListener("blur", this.cancel);
    this.unregister = props.options.register(() => this.cleanup(), this.cancel);
  }
  private cleanup() {
    this.finished = true;
    this.document.removeEventListener("keydown", this.onKeyDown, true);
    this.document.removeEventListener("focusin", this.onFocus, true);
    this.window?.removeEventListener("resize", this.cancel);
    this.window?.removeEventListener("blur", this.cancel);
    this.unregister?.();
    this.unregister = undefined;
  }
  private cancel = () => {
    if (this.finished) return;
    this.cleanup();
    this.props.onCancel();
  };
  private onFocus = (event: FocusEvent) => {
    const handle = this.props.activeNode.activatorNode.current;
    if (handle && event.target !== handle) this.cancel();
  };
  private onKeyDown = (event: KeyboardEvent) => {
    if (this.finished || event.isComposing || event.keyCode === 229) return;
    if (!this.props.activeNode.node.current?.isConnected) {
      this.cancel();
      return;
    }
    const handle = this.props.activeNode.activatorNode.current;
    if (handle && (event.target !== handle || handle.matches(":disabled,[aria-disabled=true]"))) {
      this.cancel();
      return;
    }
    const code = event.code;
    const ending = ["Space", "Enter", "Tab"].includes(code);
    if (code === "Escape" || ending) {
      event.preventDefault();
      event.stopImmediatePropagation();
      if (event.repeat) return;
      if (code === "Escape") this.cancel();
      else {
        this.cleanup();
        this.props.onEnd();
      }
      return;
    }
    if (!["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(code)) return;
    const context = this.props.context.current;
    if (!context.collisionRect) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const currentCoordinates = { x: context.collisionRect.left, y: context.collisionRect.top };
    this.reference ??= currentCoordinates;
    const coordinates = sortableKeyboardCoordinates(event, {
      active: this.props.active,
      context,
      currentCoordinates,
    });
    if (!coordinates) return;
    // Match dnd-kit's keyboard scroll compensation, including the document viewport.
    // Keep the dragged item in the visible half of its scroll frame. Scrolling changes
    // collision measurements itself; do not also move by the same amount.
    const axis = code === "ArrowLeft" || code === "ArrowRight" ? "x" : "y";
    const forward = code === "ArrowRight" || code === "ArrowDown";
    const delta = coordinates[axis] - currentCoordinates[axis];
    const adjustment = { x: 0, y: 0 };
    for (const container of context.scrollableAncestors) {
      const documentFrame = container === this.document.scrollingElement;
      const rect = documentFrame
        ? {
            left: 0,
            top: 0,
            width: this.window?.innerWidth ?? 0,
            height: this.window?.innerHeight ?? 0,
          }
        : container.getBoundingClientRect();
      const size =
        axis === "x"
          ? documentFrame
            ? rect.width
            : container.clientWidth
          : documentFrame
            ? rect.height
            : container.clientHeight;
      const start = axis === "x" ? rect.left : rect.top;
      const boundary = start + size / 2;
      if (forward ? coordinates[axis] <= boundary : coordinates[axis] >= boundary) continue;
      const offset = axis === "x" ? container.scrollLeft : container.scrollTop;
      const extent = Math.max(
        0,
        (axis === "x" ? container.scrollWidth : container.scrollHeight) - size,
      );
      const rtl = axis === "x" && this.window?.getComputedStyle(container).direction === "rtl";
      const minimum = rtl ? -extent : 0;
      const maximum = rtl ? 0 : extent;
      const target = Math.min(maximum, Math.max(minimum, offset + delta));
      if (target === offset) continue;
      container.scrollTo({ [axis === "x" ? "left" : "top"]: target, behavior: "instant" });
      const otherAxis = axis === "x" ? "y" : "x";
      if (target === offset + delta && coordinates[otherAxis] === currentCoordinates[otherAxis])
        return;
      adjustment[axis] = offset - target;
      break;
    }
    this.props.onMove({
      x: coordinates.x - this.reference.x + adjustment.x,
      y: coordinates.y - this.reference.y + adjustment.y,
    });
  };
}
