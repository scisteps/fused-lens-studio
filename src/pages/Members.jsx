import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import './Members.css'

export function Members() {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    // Fetch members from API
    fetch('/api/members')
      .then(res => res.json())
      .then(data => {
        setMembers(data)
        setLoading(false)
      })
      .catch(() => {
        // Fallback data
        setMembers([
          {
            id: 1,
            name: 'John K.',
            role: 'Lead Animator',
            expertise: '2D Animation, Character Design',
            joined: '2024-01-15',
            image: '/images/member1.jpg',
            bio: 'Passionate about bringing stories to life through animation.'
          },
          {
            id: 2,
            name: 'Sarah N.',
            role: 'Motion Designer',
            expertise: '3D Animation, Motion Graphics',
            joined: '2024-02-20',
            image: '/images/member2.jpg',
            bio: 'Creating visual experiences that captivate audiences.'
          },
          {
            id: 3,
            name: 'Michael O.',
            role: 'Storyboard Artist',
            expertise: 'Storyboarding, Visual Development',
            joined: '2024-03-10',
            image: '/images/member3.jpg',
            bio: 'Building worlds one frame at a time.'
          }
        ])
        setLoading(false)
      })
  }, [])

  const filteredMembers = members.filter(member => 
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.expertise.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="members__loading">
        <div className="spinner"></div>
        <p>Loading members...</p>
      </div>
    )
  }

  return (
    <main className="members page">
      <section className="members__hero">
        <div className="container">
          <motion.div
            className="members__hero-content"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1>Our Members</h1>
            <p>Meet the talented animators and creators of Animation Guild Uganda</p>
            <p className="members__count">{members.length} members and growing</p>
          </motion.div>
        </div>
      </section>

      <section className="members__list">
        <div className="container">
          {/* Search */}
          <div className="members__search">
            <input
              type="text"
              placeholder="Search members by name, role, or expertise..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Members Grid */}
          <div className="members__grid">
            {filteredMembers.map((member, index) => (
              <motion.div
                key={member.id}
                className="members__card"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index, duration: 0.5 }}
                whileHover={{ y: -8 }}
              >
                <div className="members__card-image">
                  {member.image ? (
                    <img src={member.image} alt={member.name} />
                  ) : (
                    <div className="members__card-avatar">
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </div>
                  )}
                </div>
                <div className="members__card-content">
                  <h3 className="members__card-name">{member.name}</h3>
                  <p className="members__card-role">{member.role}</p>
                  <p className="members__card-expertise">
                    <strong>Expertise:</strong> {member.expertise}
                  </p>
                  <p className="members__card-bio">{member.bio}</p>
                  <p className="members__card-joined">
                    Joined: {new Date(member.joined).toLocaleDateString('en-US', {
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          {filteredMembers.length === 0 && (
            <div className="members__empty">
              <p>No members found matching your search.</p>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}