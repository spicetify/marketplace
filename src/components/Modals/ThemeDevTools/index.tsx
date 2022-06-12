import React from "react";
import { getInvalidCSS } from "../../../logic/Utils";
const ThemeDevToolsModal = () => {
  return (
    <div id="marketplace-theme-dev-tools-container" className="marketplace-theme-dev-tools-container">
      {/* Create a box containing the invalid css classnames fetched from "getInvalidCSS()"*/}
      <div className="invalid-css-container">
        <h2 className="invalid-css-heading">Invalid CSS</h2>
        {getInvalidCSS().map((cssClass, index) => {
          return <div key={index} className={cssClass}>{cssClass} <br></br> <br></br></div>;
        },
        )}

      </div>
    </div>
  );
};

export default ThemeDevToolsModal;
