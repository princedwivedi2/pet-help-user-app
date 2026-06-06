import { request } from './client'

export async function getBlogPosts(query = '') {
  const suffix = query ? `?${query}` : ''
  return request(`/blog/posts${suffix}`)
}

export async function getBlogCategories() {
  return request('/blog/categories')
}

export async function getBlogPost(uuid: string) {
  return request(`/blog/posts/${uuid}`)
}

export async function likeBlogPost(uuid: string) {
  return request(`/blog/posts/${uuid}/like`, { method: 'POST' })
}
