export type RevisionItem = {
    id: number,
    author: string,
    resource_name: string,
    resource_id: string,
    snapshot: {
        [key: string]: [value: string]
    },
    changeset: {
        [key: string]: {
            old: string,
            new: string
        }
    },
    context: string,
    version: number,
    logged_at: string,
    pending: number
}
