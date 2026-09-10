import { useState } from 'react'
import { motion } from 'framer-motion'
import { resolveImage } from '../data/images'
import { useCollection } from '../lib/useCollection'
import './Members.css'

export function Members() {
  const { items: members, loading } = useCollection('members')
  const [searchTerm, setSearchTerm] = useState('')
  const filteredMembers = members.filter(member =>
    [member.name, member.role, member.expertise].some(value => value?.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  if (loading) return <div className="members__loading"><div className="spinner" /><p>Loading members...</p></div>

  return (
    <main className="members page">
      <section className="members__hero"><div className="container"><motion.div className="members__hero-content" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
        <h1>Our Members</h1><p>Meet the talented animators and creators of Animation Guild Uganda</p><p className="members__count">{members.length} members and growing</p>
      </motion.div></div></section>
      <section className="members__list"><div className="container">
        <div className="members__search"><input type="text" placeholder="Search members by name, role, or expertise..." value={searchTerm} onChange={event => setSearchTerm(event.target.value)} /></div>
        <div className="members__grid">
          {filteredMembers.map((member, index) => {
            const image = resolveImage(member.imageId) || member.image
            return <motion.div key={member.id} className="members__card" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * index, duration: 0.5 }} whileHover={{ y: -8 }}>
              <div className="members__card-image">{image ? <img src={image} alt={member.name} /> : <div className="members__card-avatar">{member.name?.split(' ').map(name => name[0]).join('')}</div>}</div>
              <div className="members__card-content"><h3 className="members__card-name">{member.name}</h3><p className="members__card-role">{member.role}</p><p className="members__card-expertise"><strong>Expertise:</strong> {member.expertise}</p><p className="members__card-bio">{member.bio}</p>{member.joined && <p className="members__card-joined">Joined: {new Date(`${member.joined}T00:00:00`).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>}</div>
            </motion.div>
          })}
        </div>
        {!filteredMembers.length && <div className="members__empty"><p>No members found matching your search.</p></div>}
      </div></section>
    </main>
  )
}
