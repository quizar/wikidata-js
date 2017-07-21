# quizar-wikidata

Quizar wikidata nodejs module.

## API

### SubjectQuery

#### static get(name: string): SubjectQuery

Get an subject query object by name.

#### static list(): string[]

Get all suject queries names.

#### static execute(name: string, params?: StringPlainObject): string[]

Executes an subject query. Returns ids.

#### execute(params?: StringPlainObject): string[]

Executes this subject query. Returns ids.
