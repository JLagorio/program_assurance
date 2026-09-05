/* Application shapes: the layer between the parts and a screen. Each answers a job a header plus
   a stack of sections could not: WorkPane (you are working through a list; the list stays),
   Inspector (the facts stay put while the content scrolls), ActionBar (the record's header
   pinned above the work, with the state axes and the actions that change them), Block (a block
   of work, always open; Collapsible is its closed twin). None takes a description prop: a
   heading plus a count is the whole label. */
export {
  ActionBar,
  type ActionBarAction,
  type ActionBarProps,
  type ActionBarState,
} from "./action-bar";
export { Block, type BlockProps } from "./block";
export {
  Inspector,
  type InspectorGroupData,
  type InspectorGroupProps,
  type InspectorProps,
} from "./inspector";
export { WorkPane, type WorkPaneProps, type WorkPaneRowProps } from "./work-pane";
