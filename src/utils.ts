/*
* @Author: Sergiy Samborskiy 
* @Date: 2019-07-25 08:32:23 
 * @Last Modified by: Sergiy Samborskiy
 * @Last Modified time: 2019-12-18 15:57:38
*/
import RandomProvider from "@develup/manageable-random";

export function sample<T>(arr: T[], randomProvider: RandomProvider): T {
    return arr[randomProvider.getNextInRange(0, arr.length)];
}

export function pick<T, K extends keyof T>(source: T, ...names: K[]): Pick<T, K> {
    let target = {} as Pick<T, K>;

    for (let name of names) {
        target[name] = source[name];
    }

    return target;
}
