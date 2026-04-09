export const TrashIcon = () => {
  return (
    <svg
      width={16}
      height={16}
      aria-hidden="true"
      focusable="false"
      role="img"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path
        strokeWidth="1.25"
        d="M3.333 5.833h13.334M8.333 9.167v5M11.667 9.167v5M4.167 5.833l.833 10c0 .92.746 1.667 1.667 1.667h6.666c.92 0 1.667-.746 1.667-1.667l.833-10M7.5 5.833v-2.5c0-.46.373-.833.833-.833h3.334c.46 0 .833.373.833.833v2.5"
      ></path>
    </svg>
  );
};

export const ChevronDownIcon = () => (
  <svg width={10} height={10} viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 3.5l3 3 3-3" />
  </svg>
);

export const WorkspaceIcon = () => (
  <svg width={16} height={16} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 5.5C1 4.7 1.7 4 2.5 4H6l1.5 2H13.5c.8 0 1.5.7 1.5 1.5v5c0 .8-.7 1.5-1.5 1.5h-11C1.7 14 1 13.3 1 12.5v-7z" />
  </svg>
);

export const PlusIcon = () => {
  return (
    <svg
      width={24}
      height={24}
      aria-hidden="true"
      focusable="false"
      role="img"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
};
