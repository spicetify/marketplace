import React from "react";

import styles from "../styles/modules/button.module.scss";

const Button = (props: {
  onClick: (e?: any) => void;
  classes?: string[];
  children: React.ReactNode;
}) => {
  const classList = [styles.button];
  if (props.classes) classList.push(...props.classes);

  return (
    <button className={classList.join(" ")} onClick={props.onClick}>
      {props.children}
    </button>
  );
};

export default Button;
