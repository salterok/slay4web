/*
 * @Author: Sergiy Samborskiy 
 * @Date: 2019-02-26 03:48:24 
 * @Last Modified by: Sergiy Samborskiy
 * @Last Modified time: 2019-07-04 13:42:18
 */

interface TurnAction {
    type: string;
}

interface TurnActionResponse {
    timeLeft: number;
}

interface TurnContract<T, R = TurnActionResponse> extends AsyncIterator<T> {
    next(value: R): Promise<IteratorResult<T>>;

}

type TurnContractFactory = (initial: TurnActionResponse) => TurnContract<TurnAction>;

interface PlayerController {
    getActions(initial: TurnActionResponse): TurnContract<TurnAction>;
}

type GameMap = any;
