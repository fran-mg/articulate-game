import React from "react";
import { FlatList, FlatListProps } from "react-native";

// 1. Swap the draggable list for a standard web FlatList
export const NestableDraggableFlatList = React.forwardRef((props: any, ref) => {
  return <FlatList {...props} ref={ref} />;
});

// 2. Mock the Scroll Container
export const NestableScrollContainer = ({ children }: any) => {
  return <>{children}</>;
};

// 3. Neutralize the ScaleDecorator
// Instead of running native animations, it just passes the component straight through.
export const ScaleDecorator = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

// Mock the hooks so they don't crash if called
export function useIsActive() {
  return false;
}
