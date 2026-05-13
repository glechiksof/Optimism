import { Routes, Route } from 'react-router-dom'
import Layout from '../components/Layout'
import ProtectedRoute from '../components/ProtectedRoute'
import Home from '../pages/Home'
import Login from '../pages/Login'
import SignUp from '../pages/SignUp'
import Tournaments from '../pages/Tournaments'
import TournamentDetail from '../pages/TournamentDetail'
import OngoingTournaments from '../pages/OngoingTournaments'
import CreateTournament from '../pages/CreateTournament'
import Teams from '../pages/Teams'
import Team from '../pages/Team'
import CreateTeam from '../pages/CreateTeam'
import Account from '../pages/Account'
import Profile from '../pages/Profile'
import Statistics from '../pages/Statistics'
import NotFound from '../pages/NotFound'

export default function AppRoutes() {
  return (
    <Routes>
      {/* Auth screens — no navbar */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<SignUp />} />

      {/* All routes with navbar */}
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/tournaments" element={<Tournaments />} />
        <Route path="/tournaments/:id" element={<TournamentDetail />} />
        <Route path="/teams" element={<Teams />} />
        <Route path="/teams/:id" element={<Team />} />

        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/tournaments/ongoing" element={<OngoingTournaments />} />
          <Route path="/create-tournament" element={<CreateTournament />} />
          <Route path="/teams/create" element={<CreateTeam />} />
          <Route path="/account" element={<Account />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/statistics" element={<Statistics />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
