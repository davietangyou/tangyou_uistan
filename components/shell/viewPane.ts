import {createContext, useContext} from 'react';

/**
 * Shell contexts shared by the view stage and sub-pages (stage S2).
 *
 * - ViewActiveContext: false while a kept-alive view is parked off-screen.
 *   Views that keep in-progress edits read it to close index-based edit
 *   sessions when the user leaves, exactly as an unmount used to.
 * - ViewPaneContext: the pane a view renders in; sub-pages portal into its
 *   layer so they park together with their view.
 */
export const ViewActiveContext = createContext<boolean>(true);

export interface ViewPaneApi {
    layer: HTMLElement | null;
    setSubPageOpen: (id: string, open: boolean) => void;
}

export const ViewPaneContext = createContext<ViewPaneApi | null>(null);

export function useViewActive(): boolean {
    return useContext(ViewActiveContext);
}
