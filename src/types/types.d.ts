/*
 * @Author: Sergiy Samborskiy 
 * @Date: 2019-02-26 03:48:24 
 * @Last Modified by: Sergiy Samborskiy
 * @Last Modified time: 2019-12-18 13:23:26
 */

interface TurnAction {
    type: string;
    data: any;
    result?: any;
}

type TurnActionResponse = any;
interface TurnActionInitializer {
    timeLeft: number;
}

interface TurnContract<T, R = TurnActionResponse> extends AsyncGenerator<T, void, R> {
    next(value: R): Promise<IteratorResult<T>>;

}

type TurnContractFactory = (initial: TurnActionInitializer) => TurnContract<TurnAction>;

interface PlayerController {
    postChanges(type: string, data: any): void;
    getActions(initial: TurnActionInitializer): TurnContract<TurnAction>;
}

