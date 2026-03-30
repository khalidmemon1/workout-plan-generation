import WorkoutApp from './workout'

export const metadata = {
  title: 'Workout Trainer — Home Gym PPL',
  description: 'Interactive workout app with rest timers, exercise guides, and Notion export',
}

export default function Home() {
  return <WorkoutApp />
}
