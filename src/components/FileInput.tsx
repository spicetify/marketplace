// Based on https://medium.com/trabe/controlled-file-input-components-in-react-3f0d42f901b8
import React from "react";

type FileInputProps = {
  value: string | File[],
  onChange: (file?: File) => void,
  disabled?: boolean,
  id?: string,
  // [x:string]: any;
};

const FileInput = (props: FileInputProps) => (
  <div>
    {/*
    {Boolean(props.value.length) && (
      // <div>Selected files: {props.value.map(f => f.name).join(", ")}</div>
      <div>File size: {props.value.length}</div>
    )}
    */}
    <label style={{ display: "block", textAlign: "center" }}>
      {!props.disabled &&
        // Don't render label if not editable
        <span>
          {props.value.length ? "Click to change image" : "Click to add image"}
        </span>
      }
      <input
        id={props.id}
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
