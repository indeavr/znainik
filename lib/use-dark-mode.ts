import useDarkModeImpl from '@fisch0920/use-dark-mode'

/** SSR-safe storage: no localStorage during prerender, so provide a noop to avoid getItem is not a function */
const noopStorage: Storage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
  clear: () => {},
  key: () => null,
  get length() {
    return 0
  }
}

export function useDarkMode() {
  const storage =
    typeof window === 'undefined' ? noopStorage : window.localStorage
  const darkMode = useDarkModeImpl(false, {
    classNameDark: 'dark-mode',
    // Types say WindowLocalStorage but runtime expects Storage (getItem/setItem). Cast for SSR noop.
    storageProvider: storage as never
  })

  return {
    isDarkMode: darkMode.value,
    toggleDarkMode: darkMode.toggle
  }
}
