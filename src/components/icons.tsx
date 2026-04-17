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
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="21" width="7" height="5" rx="0.6" transform="rotate(-90 2 21)" />
    <rect x="17" y="15.5" width="7" height="5" rx="0.6" transform="rotate(-90 17 15.5)" />
    <rect x="2" y="10" width="7" height="5" rx="0.6" transform="rotate(-90 2 10)" />
    <path d="M7 17.5H10.5C11.6046 17.5 12.5 16.6046 12.5 15.5V8.5C12.5 7.39543 11.6046 6.5 10.5 6.5H7" />
    <path d="M12.5 12H17" />
  </svg>
);

export const ShareIcon = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
);

export const PlusIcon = () => {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      role="img"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path strokeWidth="1.25" d="M10 4.167v11.666M4.167 10h11.666" />
    </svg>
  );
};
