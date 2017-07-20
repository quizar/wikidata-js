# quizar-wikidata

Quizar wikidata nodejs module.

## API

### EntityQuery

#### static get(name: string): EntityQuery

Get an entity query object by name.

#### static list(): string[]

Get all entity queries names.

#### static execute(query: EntityQuery): string[]

Executes an entity query. Returns entities ids.
