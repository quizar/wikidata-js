
import { Entity as EntitizerEntity } from 'entitizer.models';

export class LocalEntity {
    constructor(public entity: EntitizerEntity) { }

    get name() {
        return this.entity.name;
    }

    get abbr() {
        if (this.entity.abbr) {
            return this.entity.abbr;
        }
        if (this.entity.aliases && this.entity.aliases.length) {
            const abbr = this.entity.aliases.filter(item => item.toUpperCase() === item).reduce((prev, current) => prev.length > current.length ? current : prev, this.entity.name);
            return abbr === this.entity.name ? null : abbr;
        }
    }

    get shortName() {
        if (this.entity.aliases && this.entity.aliases.length) {
            return this.entity.aliases.filter(item => item.toUpperCase() !== item).reduce((prev, current) => prev.length > current.length ? current : prev, this.entity.name);
        }
        return this.entity.name;
    }

    get shortestName() {
        return this.abbr || this.shortName;
    }
}
