import { Node } from "@tiptap/core";

const CustomImage = Node.create({
  name: "customImage",

  group: "block",
  draggable: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },
      alt: {
        default: null,
      },
      title: {
        default: null,
      },
      width: {
        default: "auto",
      },
      height: {
        default: "auto",
      },
      alignment: {
        default: "center", // left, center, right 중 하나
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "img[src]",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const alignment = HTMLAttributes.alignment || "center";

    // margin-left/right로 정렬 제어
    let marginLeft = "auto";
    let marginRight = "auto";
    if (alignment === "left") {
      marginLeft = "0";
      marginRight = "auto";
    } else if (alignment === "right") {
      marginLeft = "auto";
      marginRight = "0";
    }

    return [
      "img",
      {
        ...HTMLAttributes,
        style: `
          width: ${HTMLAttributes.width};
          height: ${HTMLAttributes.height};
          display: block;
          margin-left: ${marginLeft};
          margin-right: ${marginRight};
        `,
      },
    ];
  },

  addCommands() {
    return {
      setImage:
        (options) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          });
        },
      // 이미지 정렬 변경 커맨드 추가
      setImageAlignment:
        (alignment) =>
        ({ commands, state }) => {
          const { selection } = state;
          const node = state.doc.nodeAt(selection.from);
          if (!node || node.type.name !== this.name) return false;

          return commands.command(({ tr }) => {
            tr.setNodeMarkup(selection.from, undefined, {
              ...node.attrs,
              alignment,
            });
            return true;
          });
        },
      // 이미지 크기 변경 커맨드 (옵션)
      setImageSize:
        (width, height) =>
        ({ commands, state }) => {
          const { selection } = state;
          const node = state.doc.nodeAt(selection.from);
          if (!node || node.type.name !== this.name) return false;

          return commands.command(({ tr }) => {
            tr.setNodeMarkup(selection.from, undefined, {
              ...node.attrs,
              width,
              height,
            });
            return true;
          });
        },
    };
  },
});

export default CustomImage;
