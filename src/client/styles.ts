const STYLE_ID = 'novelview-styles'

export function installStyles(): void {
  if (document.getElementById(STYLE_ID) !== null) return

  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = `
    .nv-page, .nv-settings {
      --nv-text: var(--dsw-alias-label-primary, #1f2328);
      --nv-text-secondary: var(--dsw-alias-label-secondary, #59636e);
      --nv-text-tertiary: var(--dsw-alias-label-tertiary, #69737d);
      --nv-bg: var(--dsw-alias-bg-base, #ffffff);
      --nv-layer-1: var(--dsw-alias-bg-layer-1, #ffffff);
      --nv-layer-2: var(--dsw-alias-bg-layer-2, #f3f4f6);
      --nv-card: var(--dsw-alias-card-fill, #ffffff);
      --nv-card-hover: var(--dsw-alias-card-fill-hover, #f3f4f6);
      --nv-border-1: var(--dsw-alias-border-l1, rgb(0 0 0 / 7%));
      --nv-border-2: var(--dsw-alias-border-l2, rgb(0 0 0 / 12%));
      --nv-border-3: var(--dsw-alias-border-l3, rgb(0 0 0 / 18%));
      --nv-accent: var(--dsw-alias-state-business-primary, #3b7cff);
      --nv-on-accent: var(--dsw-alias-label-on-color, #ffffff);
      --nv-error: var(--dsw-alias-state-error-primary, #d1242f);
      --nv-shadow: var(--dsw-elevation-panel, 0 8px 28px rgb(0 0 0 / 8%));
      min-height: 100%;
      color: var(--nv-text);
      background: var(--nv-bg);
    }
    .nv-page.nv-dark, .nv-settings.nv-dark {
      color-scheme: dark;
      --nv-text: var(--dsw-static-neutral-bluish-50, #f2f3f5);
      --nv-text-secondary: var(--dsw-static-neutral-bluish-300, #c3c7d1);
      --nv-text-tertiary: var(--dsw-static-neutral-bluish-400, #9299a5);
      --nv-bg: var(--dsw-static-neutral-bluish-950, #131417);
      --nv-layer-1: var(--dsw-static-neutral-bluish-875, #1b1d22);
      --nv-layer-2: var(--dsw-static-neutral-bluish-850, #23262d);
      --nv-card: var(--dsw-static-neutral-bluish-875, #1b1d22);
      --nv-card-hover: var(--dsw-static-neutral-bluish-850, #23262d);
      --nv-border-1: rgb(255 255 255 / 7%);
      --nv-border-2: rgb(255 255 255 / 12%);
      --nv-border-3: rgb(255 255 255 / 18%);
      --nv-accent: var(--dsw-static-deepseek-400, #7aaaff);
      --nv-on-accent: var(--dsw-static-neutral-bluish-950, #131417);
      --nv-error: var(--dsw-static-red-400, #ff7b81);
      --nv-shadow: 0 8px 28px rgb(0 0 0 / 28%);
    }
    .nv-shell {
      width: 100%;
      min-height: 100%;
      box-sizing: border-box;
    }
    .nv-header {
      position: sticky;
      top: 0;
      z-index: 10;
      display: flex;
      align-items: center;
      gap: 12px;
      min-height: 54px;
      padding: 0 30px;
      background: color-mix(in srgb, var(--nv-bg) 94%, transparent);
      backdrop-filter: blur(18px);
      border-bottom: 0.5px solid var(--nv-border-1);
      box-sizing: border-box;
    }
    .nv-title-group { display: flex; align-items: baseline; gap: 10px; min-width: 0; }
    .nv-brand { font-size: 15px; font-weight: 650; letter-spacing: .01em; }
    .nv-mode { color: var(--nv-text-tertiary); font-size: 12px; }
    .nv-muted { color: var(--nv-text-secondary); }
    .nv-toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-left: auto; }
    .nv-button, .nv-select {
      min-height: 34px;
      border: 0.5px solid var(--nv-border-2);
      border-radius: 9px;
      padding: 6px 11px;
      color: var(--nv-text);
      background: var(--nv-layer-1);
      font: inherit;
      font-size: 13px;
      cursor: pointer;
    }
    .nv-button.primary {
      border-color: var(--nv-accent);
      background: var(--nv-accent);
      color: var(--nv-on-accent);
    }
    .nv-button:disabled {
      color: var(--nv-text-tertiary);
      cursor: not-allowed;
      opacity: .55;
    }
    .nv-select { max-width: min(300px, 50vw); }
    .nv-settings input[type='range'] {
      accent-color: var(--nv-accent);
    }
    .nv-reader {
      width: min(100%, calc(var(--nv-reading-width, 748px) + 56px));
      margin: 0 auto;
      padding: 52px 28px 136px;
      box-sizing: border-box;
    }
    .nv-turn {
      width: min(100%, 820px);
      margin: 0 auto;
    }
    .nv-user-row {
      display: flex;
      justify-content: flex-end;
      padding-left: clamp(72px, 22%, 200px);
    }
    .nv-user-bubble {
      max-width: 520px;
      padding: 12px 18px;
      border-radius: 18px;
      border-bottom-right-radius: 6px;
      color: var(--nv-text);
      background: color-mix(in srgb, var(--nv-layer-2) 88%, var(--nv-bg));
      font-size: 14px;
      line-height: 22px;
      overflow-wrap: anywhere;
    }
    .nv-response-status {
      display: flex;
      align-items: center;
      gap: 7px;
      width: min(100%, 820px);
      margin: 38px auto 0;
      padding-bottom: 12px;
      color: var(--nv-text-tertiary);
      border-bottom: 0.5px solid var(--nv-border-1);
      font-size: 14px;
      line-height: 1.35;
    }
    .nv-status-dot { opacity: .65; }
    .nv-status-chevron { margin-left: -2px; font-size: 14px; transform: translateY(-2px); }
    .nv-assistant-response {
      width: min(100%, 820px);
      margin: 0 auto;
    }
    .nv-chapter-title {
      margin: 30px 0 18px;
      color: var(--nv-text);
      font-size: calc(var(--nv-font-size, 17px) + 7px);
      font-weight: 650;
      line-height: calc(var(--nv-font-size, 14px) + 16px);
      letter-spacing: .01em;
    }
    .nv-stream {
      display: flex;
      flex-direction: column;
      gap: 16px;
      font-size: var(--nv-font-size, 17px);
      line-height: calc(var(--nv-font-size, 14px) + 10px);
    }
    .nv-paragraph {
      margin: 0;
      white-space: pre-wrap;
      overflow-wrap: anywhere;
    }
    .nv-paragraph + .nv-paragraph {
      margin-top: 0;
    }
    .nv-empty {
      width: min(100%, 660px);
      margin: 10vh auto 0;
      padding: 40px;
      border: 1px dashed var(--nv-border-3);
      border-radius: 22px;
      text-align: center;
      box-sizing: border-box;
    }
    .nv-empty h2 { margin: 0 0 10px; font-size: 24px; }
    .nv-empty p {
      margin: 0 0 22px;
      line-height: 1.6;
      color: var(--nv-text-secondary);
    }
    .nv-composer-dock {
      position: sticky;
      bottom: 0;
      z-index: 8;
      display: flex;
      justify-content: center;
      padding: 28px 28px 18px;
      margin: 24px -28px -136px;
      background: linear-gradient(
        to bottom,
        transparent,
        var(--nv-bg) 34%
      );
    }
    .nv-composer {
      display: flex;
      align-items: center;
      gap: 10px;
      width: min(100%, 830px);
      min-height: 62px;
      padding: 10px 12px;
      border: 0.5px solid var(--nv-border-2);
      border-radius: 18px;
      background: color-mix(in srgb, var(--nv-layer-1) 94%, transparent);
      box-shadow: var(--nv-shadow);
      backdrop-filter: blur(18px);
      box-sizing: border-box;
    }
    .nv-composer-button {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      min-height: 38px;
      padding: 0 12px;
      border: 0;
      border-radius: 11px;
      color: var(--nv-text-secondary);
      background: transparent;
      font: inherit;
      font-size: 13px;
      cursor: pointer;
    }
    .nv-composer-button:disabled {
      color: var(--nv-text-tertiary);
      cursor: not-allowed;
      opacity: .5;
    }
    .nv-composer-next {
      color: var(--nv-text);
      background: var(--nv-layer-2);
    }
    .nv-composer-context {
      display: flex;
      flex: 1;
      min-width: 0;
      align-items: center;
      justify-content: center;
      gap: 8px;
      color: var(--nv-text-tertiary);
      font-size: 12px;
    }
    .nv-composer-context strong {
      max-width: 45%;
      color: var(--nv-text-secondary);
      font-weight: 500;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .nv-settings {
      display: grid;
      gap: 16px;
      align-content: start;
      grid-auto-rows: max-content;
      width: 100%;
      min-height: 100%;
      padding: 20px;
      border-radius: 16px;
      background: var(--nv-bg);
      color: var(--nv-text);
      box-sizing: border-box;
    }
    .nv-settings-card {
      padding: 20px;
      border: 0.5px solid var(--nv-border-2);
      border-radius: 14px;
      background: var(--nv-card);
      color: var(--nv-text);
    }
    .nv-settings-card h3 { margin: 0 0 8px; font-size: 16px; line-height: 1.4; }
    .nv-settings-card p {
      margin: 0 0 14px;
      color: var(--nv-text-secondary);
      font-size: 13px;
    }
    .nv-library-list { display: grid; gap: 8px; margin-top: 14px; }
    .nv-library-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 12px;
      border-radius: 10px;
      background: var(--nv-layer-2);
    }
    .nv-library-item strong { display: block; font-size: 14px; }
    .nv-library-item small { color: var(--nv-text-secondary); }
    .nv-library-actions { display: flex; gap: 6px; margin-left: auto; }
    .nv-setting-row {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 8px 16px;
      align-items: center;
      padding: 14px 0;
      border-top: 0.5px solid var(--nv-border-1);
    }
    .nv-setting-row:first-of-type { margin-top: 16px; }
    .nv-setting-row input[type='range'] {
      grid-column: 1 / -1;
      width: 100%;
      margin: 0;
    }
    .nv-setting-label { font-size: 14px; font-weight: 500; }
    .nv-setting-value {
      color: var(--nv-text-secondary);
      font-size: 13px;
      font-variant-numeric: tabular-nums;
    }
    .nv-error { color: var(--nv-error); }
    .nv-hidden { display: none; }
    @media (hover: hover) {
      .nv-button:hover, .nv-select:hover {
        border-color: var(--nv-border-3);
        background: var(--nv-card-hover);
      }
      .nv-button.primary:hover {
        border-color: var(--nv-accent);
        background: color-mix(
          in srgb,
          var(--nv-accent) 86%,
          var(--nv-text)
        );
      }
    }
    @media (max-width: 640px) {
      .nv-shell { padding-inline: 14px; }
      .nv-header { padding-inline: 14px; }
      .nv-reader { padding-inline: 16px; }
      .nv-user-row { padding-left: 36px; }
      .nv-composer-dock { padding-inline: 16px; margin-inline: -16px; }
      .nv-composer-context strong { display: none; }
      .nv-toolbar { width: 100%; margin-left: 0; }
    }
  `
  document.head.append(style)
}
