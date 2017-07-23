
import { Entity as EntitizerEntity } from 'entitizer.models';
import { LocalEntity } from './local-entity';
import { WikiEntity as DomainEntity } from 'quizar-domain';

export function convertEntitizerEntityToLocalEntity(entity: EntitizerEntity) {
    cleanObject(entity);
    return new LocalEntity(entity);
}

export function convertLocalEntityToDomainEntity(localEntity: LocalEntity) {
    const domainEntity: DomainEntity = {
        id: localEntity.entity.id,
        abbr: localEntity.entity.abbr,
        aliases: localEntity.entity.aliases,
        cc2: localEntity.entity.cc2,
        description: localEntity.entity.description,
        extract: localEntity.entity.extract,
        label: localEntity.entity.name,
        lang: localEntity.entity.lang,
        pageId: localEntity.entity.wikiPageId,
        pageTitle: localEntity.entity.wikiTitle,
        rank: localEntity.entity.rank,
        types: localEntity.entity.types
    };

    if (localEntity.entity.data) {
        domainEntity.props = Object.keys(localEntity.entity.data).reduce((prev, key) => { prev[key] = localEntity.entity.data[key].map(val => val.value); return prev; }, {});
    }

    switch (localEntity.entity.type) {
        case 'H':
            domainEntity.type = 'PERSON';
        case 'P':
            domainEntity.type = 'PRODUCT';
        case 'O':
            domainEntity.type = 'ORG';
        case 'L':
            domainEntity.type = 'LOCATION';
        case 'E':
            domainEntity.type = 'EVENT';
    }

    cleanObject(domainEntity);

    return domainEntity
}

function cleanObject(obj: any) {
    for (let prop in obj) {
        if (~[undefined, null].indexOf(obj[prop])) {
            delete obj[prop];
        }
    }

    return obj;
}
