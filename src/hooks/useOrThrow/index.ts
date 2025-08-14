export function useOrThrow<T>(useStore: () => T) {
  const store = useStore()
  if (store == null)
    throw new Error(`Please call \`${useStore.name}\` on the appropriate parent component`)
  return store
}
