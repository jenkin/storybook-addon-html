import { makeDecorator, useChannel } from "@storybook/addons";
import { EVENTS } from "./constants";

export const withHTML = makeDecorator({
  name: "withHTML",
  parameterName: "html",
  skipIfNoParametersOrOptions: false,
  wrapper: (storyFn, context, { parameters = {} }) => {
    const emit = useChannel({});

    const containerSelector = "#storybook-root, #root";
    const rootSelector = parameters.root || containerSelector;

    const observerConfig = { attributes: false, childList: true, subtree: false };
    const observerCallback = (mutationList, observer) => {
      const root = document.querySelector(rootSelector);
      let code = root ? root.innerHTML : `<p>Root selector <code>${rootSelector}</code> doesn't match any element.</p>`;

      const { removeEmptyComments, removeComments, transform } = parameters;
      if (removeEmptyComments) {
        code = code.replace(/<!--\s*-->/g, "");
      }

      if (removeComments === true) {
        code = code.replace(/<!--[\S\s]*?-->/g, "");
      } else if (removeComments instanceof RegExp) {
        code = code.replace(/<!--([\S\s]*?)-->/g, (match, p1) =>
          removeComments.test(p1) ? "" : match,
        );
      }

      if (typeof transform === "function") {
        try {
          code = transform(code);
        } catch (e) {
          console.error(e);
        }
      }

      emit(EVENTS.CODE_UPDATE, { code, options: parameters });
      observer.disconnect();
    };

    const observer = new MutationObserver(observerCallback);
    const container = document.querySelector(containerSelector);
    if (container) {
      observer.observe(container, observerConfig);
    } else {
      emit(EVENTS.CODE_UPDATE, { code: `<p>Container selector <code>${containerSelector}</code> doesn't match any element.</p>`, options: parameters });
    }

    return storyFn(context);
  },
});

if (module && module.hot && module.hot.decline) {
  module.hot.decline();
}
