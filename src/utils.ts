/*
 * @Author: Sergiy Samborskiy 
 * @Date: 2019-07-25 08:32:23 
 * @Last Modified by:   Sergiy Samborskiy 
 * @Last Modified time: 2019-07-25 08:32:23 
 */

export function rand(max: number, min = 0) {
    return min + (max * Math.random()) | 0;
}

export function sample<T>(arr: T[]): T {
    return arr[rand(arr.length)];
}
