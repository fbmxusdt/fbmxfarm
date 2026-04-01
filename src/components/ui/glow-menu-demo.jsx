import { useState } from "react"
import { Home, Info, TrendingUp, Gamepad2 } from "lucide-react"
import { MenuBar } from "@/components/ui/glow-menu"

const menuItems = [
  {
    icon: Home,
    label: "Home",
    href: "#",
    gradient:
      "radial-gradient(circle, rgba(76,175,80,0.20) 0%, rgba(46,125,50,0.08) 50%, rgba(27,94,32,0) 100%)",
    iconColor: "text-green-400",
  },
  {
    icon: Info,
    label: "About",
    href: "#",
    gradient:
      "radial-gradient(circle, rgba(59,130,246,0.20) 0%, rgba(37,99,235,0.08) 50%, rgba(29,78,216,0) 100%)",
    iconColor: "text-blue-400",
  },
  {
    icon: TrendingUp,
    label: "Investors",
    href: "#",
    gradient:
      "radial-gradient(circle, rgba(251,191,36,0.20) 0%, rgba(245,158,11,0.08) 50%, rgba(217,119,6,0) 100%)",
    iconColor: "text-yellow-400",
  },
  {
    icon: Gamepad2,
    label: "Play",
    href: "#",
    gradient:
      "radial-gradient(circle, rgba(168,85,247,0.20) 0%, rgba(139,92,246,0.08) 50%, rgba(109,40,217,0) 100%)",
    iconColor: "text-purple-400",
  },
]

export function GlowMenuDemo() {
  const [active, setActive] = useState("Home")

  return (
    <div className="flex items-center justify-center p-8">
      <MenuBar
        items={menuItems}
        activeItem={active}
        onItemClick={setActive}
      />
    </div>
  )
}
