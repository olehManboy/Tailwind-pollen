import type { CSSVarsPonyfillOptions } from 'css-vars-ponyfill';
import type { Config, ConfigObject } from '../../@types/pollen';
import modules from '../modules';

/**
 * Conditionally load and apply a shim for CSS variables in IE
 */
export function shimmie({
  onComplete,
  ...config
}: { onComplete?(): void } & Partial<CSSVarsPonyfillOptions>): void {
  const test =
    ((window || {}).CSS || {}).supports && window.CSS.supports('(--a: 0)');

  if (!test) {
    document.body.style.visibility = 'hidden';
    import('css-vars-ponyfill').then(({ default: cssVarsPonyfill }) => {
      cssVarsPonyfill({
        watch: true,
        updateURLs: false,
        onComplete() {
          onComplete && onComplete();
          document.body.style.visibility = 'visible';
        },
        ...config
      });
    });
  }
}

/**
 * Configuration helper to provide typescript support
 */
export function defineConfig(config: Config): ConfigObject {
  return typeof config === 'function' ? config(modules) : config;
}
