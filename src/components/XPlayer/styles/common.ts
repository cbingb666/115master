export const controlStyles = {
  btn: {
    root: [
      'btn btn-link btn-circle tooltip',
      'text-base-content disabled:text-base-content/30',
      'hover:text-base-content/80',
    ],
    icon: ['size-8', 'drop-shadow-xs/60'],
  },
  btnText: {
    root: [
      'btn btn-link text-base rounded-full tooltip px-1.5 font-semibold',
      'text-base-content disabled:text-base-content/30',
      'hover:text-base-content/80',
      'no-underline hover:no-underline!',
      'text-shadow-[0_0_2px_rgba(0_0_0_/0.3),0_0_2px_rgba(0_0_0_/0.3),0_0_2px_rgba(0_0_0_/0.3)]',
    ],
  },
  menu: {
    root: 'menu p-0 min-w-32 gap-1',
    a: 'rounded-lg',
    active: 'menu-active',
    icon: 'size-6',
    label: 'text-base-content',
    desc: 'text-base-content/60',
  },
  text: 'text-sm text-base-content text-shadow-xs/60 text-shadow-[0_0_2px_rgba(0_0_0_/0.3),0_0_2px_rgba(0_0_0_/0.3),0_0_2px_rgba(0_0_0_/0.3)]',
  subtext: 'text-base-content/60',
}

export const controlRightStyles = {
  btn: {
    root: [controlStyles.btn.root, 'tooltip-left'],
    icon: controlStyles.btn.icon,
  },
  btnText: {
    root: controlStyles.btnText.root,
  },
}
