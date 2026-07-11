// PoetDetailHeroTransition.tsx
// Drop-in для src/components/poet-detail/Hero.tsx
// Даёт shared-element morph из Зала Поэтов
// 
// В вашем текущем Hero.tsx найдите <img src={asset(poet.portrait)} ... />
// Замените на:
//
// import { motion } from 'framer-motion'
// import { asset } from '@/utils/asset'
//
// <motion.img
//   src={asset(poet.portrait)}
//   alt={`Портрет: ${poet.name}`}
//   layoutId={`poet-portrait-${poet.id}`}
//   transition={{ type: 'spring', stiffness: 210, damping: 28 }}
//   className="h-full w-full object-cover"
// />
//
// Тогда при клике из HallOfPoets (onSelect сохраняет tlp_hall_last_poet)
// портрет плавно морфится из ниши в hero-баннер.
//
// Если хотите автопрокрутку обратно к нише при Back:
// 
// useEffect(() => {
//   return () => {
//     try { sessionStorage.setItem('tlp_hall_return_to', poet.id) } catch {}
//   }
// }, [poet.id])
//
// Полный пример Hero с transition — ниже (адаптируйте под вашу верстку):

import { motion } from 'framer-motion'
import { asset } from '@/utils/asset'

export function PoetHeroPortrait({ poetId, portrait, name }: { poetId: string, portrait: string, name: string }) {
  return (
    <motion.img
      src={asset(portrait)}
      alt={`Портрет: ${name}`}
      layoutId={`poet-portrait-${poetId}`}
      transition={{ type: 'spring', stiffness: 210, damping: 28, mass: 0.9 }}
      className="h-full w-full object-cover object-[center_20%]"
      style={{originX: 0.5, originY: 0.5}}
    />
  )
}

// Как подключить в вашем src/components/poet-detail/Hero.tsx:
// 
// import { PoetHeroPortrait } from '@/components/hall/PoetDetailHeroTransition'
// ...
// <div className="relative aspect-[4/5] ...">
//   <PoetHeroPortrait poetId={poet.id} portrait={poet.portrait} name={poet.name} />
// </div>
//
// В HallOfPoets.tsx onSelect уже пишет:
//   sessionStorage.setItem('tlp_hall_last_poet', poet.id)
// этого достаточно для Framer Motion shared layout.
//
// Важно: <AnimatePresence mode="wait"> должен оборачивать <Routes> в App.tsx
// У вас React Router v7 — добавьте:
//
// import { AnimatePresence } from 'framer-motion'
// import { useLocation } from 'react-router-dom'
//
// function AnimatedRoutes() {
//   const location = useLocation()
//   return (
//     <AnimatePresence mode="wait">
//       <Routes location={location} key={location.pathname}>
//         ...
//       </Routes>
//     </AnimatePresence>
//   )
// }
//
// Тогда morph работает между / (Hall) и /poets/:id
export {}
