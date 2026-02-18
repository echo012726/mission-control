import { ConvexReactClient } from "convex/react";
import { createContext, useContext } from "react";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || "";
const convex = new ConvexReactClient(convexUrl);

const ConvexContext = createContext(convex);

export function ConvexClientProvider({ children }: { children: React.ReactNode }) {
  return <ConvexContext.Provider value={convex}>{children}</ConvexContext.Provider>;
}

export function useConvex() { return useContext(ConvexContext); }
export { convex };
