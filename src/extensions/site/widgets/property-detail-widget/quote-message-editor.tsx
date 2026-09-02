import { useMemo } from "react";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";

interface QuoteMessageEditorProps {
  value: string;
  onChange: (value: string) => void;
  invalid?: boolean;
}

const formats = [
  "header",
  "bold",
  "italic",
  "underline",
  "strike",
  "blockquote",
  "list",
  "indent",
  "align",
  "link",
];

export function QuoteMessageEditor({
  value,
  onChange,
  invalid = false,
}: QuoteMessageEditorProps) {
  const modules = useMemo(
    () => ({
      toolbar: [
        [{ header: [2, 3, false] }],
        ["bold", "italic", "underline", "strike"],
        [{ list: "ordered" }, { list: "bullet" }, { indent: "-1" }, { indent: "+1" }],
        [{ align: [] }],
        ["blockquote", "link", "clean"],
      ],
    }),
    [],
  );

  return (
    <ReactQuill
      theme="snow"
      value={value}
      onChange={onChange}
      modules={modules}
      formats={formats}
      placeholder="Tell us what you need, preferred dates, or questions about this property…"
      aria-label="Message"
      aria-invalid={invalid}
    />
  );
}
