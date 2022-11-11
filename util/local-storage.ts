export const retrieveData = <T>(name: string) => {
  const data =
    typeof window !== 'undefined'
      ? window.localStorage.getItem(name)
      : undefined

  if (data) {
    return JSON.parse(data) as T
  }
}
export const storeData = (name: string, item: any) => {
  window.localStorage.setItem(name, JSON.stringify(item))
}
