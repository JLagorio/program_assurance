import { useSideNav } from "./context";
import { Panel } from "./panel";
import { Aside, BannerArea, Main, ShellRoot } from "./root";
import { SideNav } from "./side-nav";
import { AppLogo, AppSwitcher, Mark, Profile, TopNav } from "./top-nav";

/**
 * The navigation system. Shell is the root; its areas are its immediate children in a fixed
 * order: Banner, TopNav, SideNav, Main, Aside, Panel. Routes contribute Aside and Panel through
 * stable portal destinations; their content and state belong to the route.
 * The package owns the areas and their behaviour: the side nav collapses, resizes, flies out on
 * hover and overlays the page on a narrow viewport; the panel resizes, runs the full height of the
 * window beside the banner and the top nav, and replaces Main on compact screens; the banner
 * pushes everything down. The product owns what goes in them: the nav data, the router, the
 * search, the actions, whatever fills the panel. Every part renders one element, forwards the
 * native props and the ref to it, and takes Base UI `render` where the element may change.
 */
export const Shell = Object.assign(ShellRoot, {
  Banner: BannerArea,
  TopNav,
  SideNav,
  Main,
  Aside,
  Panel,
  AppLogo,
  AppSwitcher,
  Mark,
  Profile,
});

export { useSideNav };
export type { SideNavTrigger } from "./context";
export type { ShellSplitterProps } from "./splitter";
export type { ShellAsideProps, ShellBannerProps, ShellMainProps, ShellProps } from "./root";
export type {
  AppLogoProps,
  AppSwitcherProps,
  ProfileProps,
  ShellMarkProps,
  ShellTopNavEndProps,
  ShellTopNavMiddleProps,
  ShellTopNavProps,
  ShellTopNavStartProps,
} from "./top-nav";
export type {
  IconComponent,
  SideNavBodyProps,
  SideNavExpandableProps,
  SideNavFooterProps,
  SideNavHeaderProps,
  SideNavIcon,
  SideNavItemProps,
  SideNavProps,
  SideNavSectionProps,
  SideNavSlotProps,
  SideNavToggleButtonProps,
} from "./side-nav";
export type {
  ShellPanelActionsProps,
  ShellPanelBodyProps,
  ShellPanelCloseProps,
  ShellPanelHeaderProps,
  ShellPanelProps,
  ShellPanelTitleProps,
} from "./panel";
