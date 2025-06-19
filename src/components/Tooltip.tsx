import React from "react";

export default function Tooltip({ children, ...args }: Partial<Spicetify.ReactComponent.TooltipProps>) {
  if (Spicetify.ReactComponent.TooltipWrapper) {
    return <Spicetify.ReactComponent.TooltipWrapper {...args}>{children}</Spicetify.ReactComponent.TooltipWrapper>;
  }

  return children;
}
