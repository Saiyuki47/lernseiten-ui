import type { ReactNode } from 'react'

// Geteilte Tab-Leiste: rendert die Buttons; die Tab-Liste (id/label/icon) bleibt
// pro App, da sich Tabs/Icons je Fach unterscheiden. Nutzt die App-CSS-Klassen
// `.tabs`/`.tab` (in der gemeinsamen styles.css).
export interface TabDef<T extends string = string> {
  id: T
  label: string
  icon?: ReactNode
}

interface Props<T extends string> {
  tabs: readonly TabDef<T>[]
  activeTab: T
  onTabChange: (tab: T) => void
}

export function Tabs<T extends string>({ tabs, activeTab, onTabChange }: Props<T>) {
  return (
    <div className="tabs">
      {tabs.map(tab => (
        <button
          key={tab.id}
          type="button"
          className={`tab${activeTab === tab.id ? ' active' : ''}`}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  )
}
