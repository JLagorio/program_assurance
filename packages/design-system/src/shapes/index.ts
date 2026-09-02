/* Application shapes: the layer between the parts and a screen. Each answers a job a header plus
   a stack of sections could not: WorkPane (you are working through a list; the list stays),
   Inspector (the facts stay put while the content scrolls), ActionBar (state and the actions that
   change it, pinned), Block (a block of work, always open; Collapsible is its closed twin). None
   takes a description prop: a heading plus a count is the whole label. */
export { ActionBar, type ActionBarAction, type ActionBarState } from "./action-bar";
export { Block } from "./block";
export { Inspector, type InspectorGroupData } from "./inspector";
export { WorkPane } from "./work-pane";
