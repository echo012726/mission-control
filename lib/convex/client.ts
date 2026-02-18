import { ConvexReactClient } from "convex/react";
import { createContext, useContext } from "react";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL || "http://localhost:3000");

const ConvexContext = createContext<ConvexReactClient>(convex);

export function ConvexClientProvider({ children }: { children: React.ReactNode }) {
  return (
    <ConvexContext.Provider value={convex}>
      {children}
    </ConvexContext.Provider>
  );
}

export function useConvex() {
  return useContext(ConvexContext);
}

export { convex };
