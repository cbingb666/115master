export const controlStyles = {
  btn: {
    icon: 'size-7',
  },
  btnText: {
    root: [
      'text-base font-semibold',
      'no-underline hover:no-underline!',
      'text-shadow-[0_0_2px_rgba(0_0_0_/0.3),0_0_2px_rgba(0_0_0_/0.3),0_0_2px_rgba(0_0_0_/0.3)]',
    ],
  },
  menu: {
    root: 'menu p-2 min-w-32 gap-1',
    a: 'rounded-xl',
    active: 'menu-active bg-primary!',
    icon: 'size-6',
    label: 'text-base-content',
    desc: 'text-base-content/60',
  },
  text: 'text-sm text-base-content text-shadow-xs/60 text-shadow-[0_0_2px_rgba(0_0_0_/0.3),0_0_2px_rgba(0_0_0_/0.3),0_0_2px_rgba(0_0_0_/0.3)]',
  subtext: 'text-base-content/60',
}
