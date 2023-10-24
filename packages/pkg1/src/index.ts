import { cloneDeep} from 'lodash-es'

console.log('pkg1')

const a = {
    name: 1
}
export const c = cloneDeep(a)
