import { useCallback, useMemo, useRef } from 'react';
import { dashboard } from '@wix/dashboard';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
}

const formats = [
  'header',
  'font',
  'size',
  'bold',
  'italic',
  'underline',
  'strike',
  'blockquote',
  'code-block',
  'color',
  'background',
  'align',
  'list',
  'indent',
  'link',
  'image',
];

export function RichTextEditor({ value, onChange }: RichTextEditorProps) {
  const editorRef = useRef<ReactQuill | null>(null);

  const insertImages = useCallback(async () => {
    try {
      const response = await dashboard.openMediaManager({
        category: 'IMAGE',
        multiSelect: true,
      });
      const editor = editorRef.current?.getEditor();
      if (!response || !editor) return;

      const range = editor.getSelection(true);
      let insertAt = range?.index ?? editor.getLength();
      for (const item of response.items) {
        const url = item.url?.trim();
        if (!url) continue;
        editor.insertEmbed(insertAt, 'image', url, 'user');
        insertAt += 1;
        editor.insertText(insertAt, '\n', 'user');
        insertAt += 1;
      }
      editor.setSelection(insertAt, 0, 'silent');
    } catch (error) {
      console.error('Unable to insert images into the description.', error);
      dashboard.showToast({
        type: 'error',
        message: 'Images could not be added to the description.',
      });
    }
  }, []);

  const modules = useMemo(
    () => ({
      toolbar: {
        container: [
          [{ font: [] }, { size: ['small', false, 'large', 'huge'] }],
          [{ header: [1, 2, 3, 4, 5, 6, false] }],
          ['bold', 'italic', 'underline', 'strike'],
          [{ color: [] }, { background: [] }],
          [{ blockquote: true }, { 'code-block': true }],
          [{ align: [] }],
          [
            { list: 'ordered' },
            { list: 'bullet' },
            { indent: '-1' },
            { indent: '+1' },
          ],
          ['link', 'image', 'clean'],
        ],
        handlers: { image: insertImages },
      },
    }),
    [insertImages],
  );

  return (
    <ReactQuill
      ref={editorRef}
      theme="snow"
      value={value}
      onChange={onChange}
      modules={modules}
      formats={formats}
      placeholder="Describe the light, layout, finishes, and reasons to love this property…"
      aria-label="Listing description"
    />
  );
}
