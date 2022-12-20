import React from "react";

import styles from "../styles/modules/button.module.scss";

// Round is the default style
// Circle is used by the install/remove button
type ButtonType = "round" | "circle";

const Button = (props: {
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  classes?: string[];
  label?: string | null;
  type?: ButtonType;
  children: React.ReactNode;
  disabled?: boolean;
}) => {
  const buttonType = props.type || "round";

  const classList = [styles.button];
  if (buttonType === "circle") classList.push(styles.circle);
  if (props.classes) classList.push(...props.classes);

  return (
    <button className={classList.join(" ")} onClick={props.onClick} aria-label={props.label || ""} disabled={props.disabled}>
      {props.children}
    </button>
  );
};

export default Button;
