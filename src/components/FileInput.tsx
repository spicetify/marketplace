// Based on https://medium.com/trabe/controlled-file-input-components-in-react-3f0d42f901b8
import React from "react";

type FileInputProps = {
  value: string | File[],
  onChange: (file?: File) => void,
  disabled?: boolean,
  // [x:string]: any;
};

/**
 * Takes a file and converts it to a base64 string.
 */
const FileInput = (props: FileInputProps) => (
  <div>
    {Boolean(props.value.length) && (
      // <div>Selected files: {props.value.map(f => f.name).join(", ")}</div>
      <div>File size: {props.value.length}</div>
    )}
    <label>
      Click to select some files...
      <input
        disabled={props.disabled}
        // {...rest}
        style={{ display: "none" }}
        type="file"
        onChange={e => {
          props.onChange(e.target.files?.[0]);
        }}
      />
    </label>
  </div>
);

export default FileInput;
