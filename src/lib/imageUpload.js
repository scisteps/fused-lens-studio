// src/lib/imageUpload.js
//
// Used by the News & Events dashboard (and any dashboard that needs images)
// to upload a file straight to Firebase Storage and get back a public URL
// to store on the entry. Draft state only ever holds URLs/strings — never
// raw File objects — so it stays JSON-serialisable for localStorage.

import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { storage } from './firebase'

export async function uploadImage(file, folder = 'news-events') {
  const safeName = `${Date.now()}-${file.name.replace(/[^a-z0-9.\-_]/gi, '_')}`
  const storageRef = ref(storage, `${folder}/${safeName}`)
  await uploadBytes(storageRef, file)
  return getDownloadURL(storageRef)
}
