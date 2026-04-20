import { useEffect, useState } from "react"
import { getLeaderboard } from "../../services/engagementService"

export default function Leaderboard() {
  const [items, setItems] = useState([])

  useEffect(() => {
    const load = async () => {
      const data = await getLeaderboard()
      setItems(data)
    }
    load()
  }, [])

  return (
    <div className="dashboard-content">
      <div className="analytics-header-wrap mb-4">
        <h2 className="analytics-heading mb-1">Leaderboard</h2>
        <p className="analytics-subheading mb-0">Rankings based on points, streaks, and badges.</p>
      </div>

      <div className="table-responsive">
        <table className="table table-bordered">
          <thead className="table-dark">
            <tr>
              <th>Rank</th>
              <th>Student</th>
              <th>Points</th>
              <th>Streak</th>
              <th>Badges</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr><td colSpan="5" className="text-center">No leaderboard data yet</td></tr>
            ) : (
              items.map((item, idx) => (
                <tr key={item.student_id}>
                  <td>#{idx + 1}</td>
                  <td>{item.name}</td>
                  <td>{item.points}</td>
                  <td>{item.streak_days}</td>
                  <td>{Array.isArray(item.badges) ? item.badges.join(", ") : "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
