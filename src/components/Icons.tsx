import React from "react";

export const DownloadIcon = () => (
  <svg role="img" width="16" height="16" viewBox="0 0 512 512" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
    <path d="M480 352h-133.5l-45.25 45.25C289.2 409.3 273.1 416 256 416s-33.16-6.656-45.25-18.75L165.5 352H32c-17.67 0-32 14.33-32 32v96c0 17.67 14.33 32 32 32h448c17.67 0 32-14.33 32-32v-96C512 366.3 497.7 352 480 352zM432 456c-13.2 0-24-10.8-24-24c0-13.2 10.8-24 24-24s24 10.8 24 24C456 445.2 445.2 456 432 456zM233.4 374.6C239.6 380.9 247.8 384 256 384s16.38-3.125 22.62-9.375l128-128c12.49-12.5 12.49-32.75 0-45.25c-12.5-12.5-32.76-12.5-45.25 0L288 274.8V32c0-17.67-14.33-32-32-32C238.3 0 224 14.33 224 32v242.8L150.6 201.4c-12.49-12.5-32.75-12.5-45.25 0c-12.49 12.5-12.49 32.75 0 45.25L233.4 374.6z" fill="currentColor" />
  </svg>
);

export const GitHubIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" fill="currentColor"/>
  </svg>
);

export const LoadingIcon = () => (
  <svg width="100px" height="100px" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid">
    <circle cx="50" cy="50" r="0" fill="none" stroke="currentColor" strokeWidth="2">
      <animate attributeName="r" repeatCount="indefinite" dur="1s" values="0;40" keyTimes="0;1" keySplines="0 0.2 0.8 1" calcMode="spline" begin="0s" />
      <animate attributeName="opacity" repeatCount="indefinite" dur="1s" values="1;0" keyTimes="0;1" keySplines="0.2 0 0.8 1" calcMode="spline" begin="0s" />
    </circle>
    <circle cx="50" cy="50" r="0" fill="none" stroke="currentColor" strokeWidth="2">
      <animate attributeName="r" repeatCount="indefinite" dur="1s" values="0;40" keyTimes="0;1" keySplines="0 0.2 0.8 1" calcMode="spline" begin="-0.5s" />
      <animate attributeName="opacity" repeatCount="indefinite" dur="1s" values="1;0" keyTimes="0;1" keySplines="0.2 0 0.8 1" calcMode="spline" begin="-0.5s" />
    </circle>
  </svg>
);

export class LoadMoreIcon extends React.Component<{onClick: () => void}> {
  render() {
    return (
      <div className="MarketplaceIcon--loadMore" onClick={this.props.onClick}>
        <p>»</p>
        <span>Load more</span>
      </div>
    );
  }
}

export const SettingsIcon = () => (
  <svg role="img" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
    <path d="M24 13.616v-3.232c-1.651-.587-2.694-.752-3.219-2.019v-.001c-.527-1.271.1-2.134.847-3.707l-2.285-2.285c-1.561.742-2.433 1.375-3.707.847h-.001c-1.269-.526-1.435-1.576-2.019-3.219h-3.232c-.582 1.635-.749 2.692-2.019 3.219h-.001c-1.271.528-2.132-.098-3.707-.847l-2.285 2.285c.745 1.568 1.375 2.434.847 3.707-.527 1.271-1.584 1.438-3.219 2.02v3.232c1.632.58 2.692.749 3.219 2.019.53 1.282-.114 2.166-.847 3.707l2.285 2.286c1.562-.743 2.434-1.375 3.707-.847h.001c1.27.526 1.436 1.579 2.019 3.219h3.232c.582-1.636.75-2.69 2.027-3.222h.001c1.262-.524 2.12.101 3.698.851l2.285-2.286c-.744-1.563-1.375-2.433-.848-3.706.527-1.271 1.588-1.44 3.221-2.021zm-12 2.384c-2.209 0-4-1.791-4-4s1.791-4 4-4 4 1.791 4 4-1.791 4-4 4z" fill="currentColor" />
  </svg>
);

export const ThemeDeveloperToolsIcon = () => (
  <svg className="devtools-icon" version="1.1" viewBox="1 1 22 22" xmlSpace="preserve" xmlns="http://www.w3.org/2000/svg">
    <g className="devtools-icon-internal" id="grid_system"/><g id="_icons"><path d="M18,12v-0.9l0.7-5.7C18.8,4.5,18.6,3.7,18,3c-0.6-0.6-1.4-1-2.2-1H8.3C7.4,2,6.6,2.4,6,3C5.4,3.7,5.2,4.5,5.3,5.4L6,11.1   V12c0,1.6,1.3,2.9,2.8,3l-0.4,2.9c-0.1,1,0.2,2.1,0.8,2.9S11,22,12,22s2-0.5,2.7-1.2s1-1.8,0.8-2.9L15.2,15   C16.7,14.9,18,13.6,18,12z M7.5,4.3C7.7,4.1,8,4,8.3,4H13v2c0,0.6,0.4,1,1,1s1-0.4,1-1V4h0.7c0.3,0,0.6,0.1,0.8,0.3   c0.2,0.2,0.3,0.5,0.2,0.8L16.1,10H7.9L7.3,5.1C7.2,4.8,7.3,4.6,7.5,4.3z M13.2,19.4c-0.6,0.7-1.8,0.7-2.4,0   c-0.3-0.4-0.4-0.8-0.4-1.3l0.5-3.2h2.3l0.5,3.2C13.7,18.6,13.5,19.1,13.2,19.4z M15,13h-1h-4H9c-0.6,0-1-0.4-1-1h8   C16,12.6,15.6,13,15,13z"/></g>
  </svg>
);

export const TrashIcon = () => (
  <svg role="img" width="16" height="16" viewBox="0 0 448 512" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
    <path d="M53.21 467c1.562 24.84 23.02 45 47.9 45h245.8c24.88 0 46.33-20.16 47.9-45L416 128H32L53.21 467zM432 32H320l-11.58-23.16c-2.709-5.42-8.25-8.844-14.31-8.844H153.9c-6.061 0-11.6 3.424-14.31 8.844L128 32H16c-8.836 0-16 7.162-16 16V80c0 8.836 7.164 16 16 16h416c8.838 0 16-7.164 16-16V48C448 39.16 440.8 32 432 32z" fill="currentColor" />
  </svg>
);
