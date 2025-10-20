// contentlayer.config.ts
import { defineDocumentType, makeSource } from 'contentlayer/source-files'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import rehypeSlug from "rehype-slug"
import rehypeRaw from 'rehype-raw'


export const Post = defineDocumentType(() => ({
    name: 'Post',
    filePathPattern: '**/*.md',
    contentType: 'markdown',
    fields: {
        title: { type: 'string', required: true },
        date: { type: 'date', required: true },
        authors: { type: 'list', of: { type: 'string' } },
        tags: { type: 'list', of: { type: 'string' } },
        description: { type: 'string' },
        readingTime: { type: 'number' },
        external: { type: 'string' },
        spotifyTrack: { type: 'string' },
    },
    computedFields: {
        slug: {
            type: 'string',
            resolve: (doc: any) => doc._raw.flattenedPath.replace(/\\/g, '/').replace(/\/index$/i, ''),
        },
    },
}))

export default makeSource({
    contentDirPath: 'content',
    documentTypes: [Post],
    markdown: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [rehypeRaw, rehypeSlug, rehypeHighlight as any],
    },
})
