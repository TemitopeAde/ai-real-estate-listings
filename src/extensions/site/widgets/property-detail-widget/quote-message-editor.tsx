import { useMemo } from "react";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";

import { t, type WidgetLangCode } from "../../../../lib/widget-i18n";

interface QuoteMessageEditorProps {
  value: string;
  onChange: (value: string) => void;
  invalid?: boolean;
  lang: WidgetLangCode;
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
  lang,
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
      placeholder={t(lang, "quotePlaceholder")}
      aria-label={t(lang, "message")}
      aria-invalid={invalid}
    />
  );
}
