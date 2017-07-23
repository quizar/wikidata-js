
import { Bluebird } from '../utils';
import { getEntities, WikiEntity } from 'wiki-entity';
import { EntityBuilder } from 'entitizer.models-builder';
import { LocalEntity } from './local-entity';
import { convertEntitizerEntityToLocalEntity } from './converter';
import * as LRU from 'lru-cache';

const CACHE = LRU<LocalEntity>({ max: 200, maxAge: 1000 * 60 * 10 });

export function exploreEntity(id: string, lang: string): Bluebird<LocalEntity> {
    const key = [id, lang].join('-');
    if (CACHE.has(key)) {
        return Bluebird.resolve(CACHE.get(key));
    }
    return <Bluebird<LocalEntity>>getEntities({
        ids: id,
        language: lang,
        props: 'info|sitelinks|aliases|labels|descriptions|claims|datatype',
        claims: 'item',
        extract: 3,
        types: ['dbo', 'schema'],
        redirects: true
    })
        .then(entities => entities && entities.length && EntityBuilder.fromWikiEntity(entities[0], lang))
        .then(entity => {
            if (entity) {
                const localEntity = convertEntitizerEntityToLocalEntity(entity);
                CACHE.set(key, localEntity);
                return localEntity;
            }
        });
}
