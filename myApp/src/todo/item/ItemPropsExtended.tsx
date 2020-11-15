import { ItemProps } from "./ItemProps";

export interface ItemPropsExtended extends ItemProps{
    onEdit : (id? : number) => void;
}