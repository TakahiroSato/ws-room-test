use serde::Serialize;
use std::cell::{Cell, RefCell};

#[derive(Serialize, Clone, Debug, PartialEq)]
pub enum States {
    End,
    TurnPlayer1,
    TurnPlayer2,
}

#[derive(PartialEq, Clone)]
enum Disc {
    None = 0,
    White = 1,
    Black = 2,
}

impl Disc {
    pub fn u8(&self) -> u8 {
        self.clone() as u8
    }
}

#[derive(Debug)]
pub struct Reversi {
    pub player1_id: Cell<usize>,
    pub player2_id: Cell<usize>,
    pub state: RefCell<States>,
    pub discs: RefCell<Vec<Vec<u8>>>,
}

impl Reversi {
    pub fn new() -> Self {
        Self {
            player1_id: Cell::new(0),
            player2_id: Cell::new(0),
            state: RefCell::new(States::End),
            discs: RefCell::new(vec![vec![]]),
        }
    }

    pub fn init(&self) {
        self.discs.replace(vec![
            vec![0, 0, 0, 0, 0, 0, 0, 0],
            vec![0, 0, 0, 0, 0, 0, 0, 0],
            vec![0, 0, 0, 0, 0, 0, 0, 0],
            vec![0, 0, 0, 1, 2, 0, 0, 0],
            vec![0, 0, 0, 2, 1, 0, 0, 0],
            vec![0, 0, 0, 0, 0, 0, 0, 0],
            vec![0, 0, 0, 0, 0, 0, 0, 0],
            vec![0, 0, 0, 0, 0, 0, 0, 0],
        ]);
        self.state.replace(States::TurnPlayer1);
    }

    pub fn end(&self) {
        self.discs.replace(vec![vec![0; 8]; 8]);
        self.state.replace(States::End);
    }

    pub fn set_disc(&self, id: usize, _x: usize, _y: usize) -> Result<(), ()> {
        if _x > 7 || _y > 7 {
            return Err(());
        }
        let id1 = self.player1_id.get();
        let id2 = self.player2_id.get();
        let mut disc = Disc::None;
        if id == id1 {
            disc = Disc::White;
            if self.state.clone().into_inner() != States::TurnPlayer1 {
                return Err(());
            }
        }
        if id == id2 {
            disc = Disc::Black;
            if self.state.clone().into_inner() != States::TurnPlayer2 {
                return Err(());
            }
        }
        if disc != Disc::None {
            let mut discs = self.discs.clone();
            if discs.get_mut()[_y][_x] != 0 {
                return Err(());
            }
            discs.get_mut()[_y][_x] = disc.u8();
            self.discs.replace(discs.into_inner());
            self.update_discs(_x, _y);
            match disc {
                Disc::White => {
                    self.state.replace(States::TurnPlayer2);
                }
                Disc::Black => {
                    self.state.replace(States::TurnPlayer1);
                }
                _ => (),
            };
            Ok(())
        } else {
            Err(())
        }
    }

    pub fn get_discs(&self) -> Vec<Vec<u8>> {
        let discs = self.discs.clone();
        discs.into_inner()
    }

    fn update_discs(&self, x: usize, y: usize) {
        let mut discs = self.discs.clone().into_inner();
        let disc = match discs[y][x] {
            1 => Disc::White,
            2 => Disc::Black,
            _ => Disc::None,
        };
        if disc == Disc::None {
            return;
        }
        fn update(discs: &mut Vec<Vec<u8>>, disc: &Disc, x: i8, y: i8, addx: i8, addy: i8) -> bool {
            if x < 0 || x > 7 || y < 0 || y > 7 {
                return false;
            }
            let (x, y) = (x as usize, y as usize);
            let old_disc = discs[y][x];
            if discs[y][x] != Disc::None as u8 && discs[y][x] != disc.u8() {
                discs[y][x] = disc.u8();
            } else if discs[y][x] == disc.u8() {
                return true;
            } else {
                return false;
            }
            let result = update(discs, &disc, x as i8 + addx, y as i8 + addy, addx, addy);
            if !result {
                discs[y][x] = old_disc;
            }
            result
        }
        let (x, y) = (x as i8, y as i8);
        update(&mut discs, &disc, x + 1, y, 1, 0);
        update(&mut discs, &disc, x - 1, y, -1, 0);
        update(&mut discs, &disc, x, y + 1, 0, 1);
        update(&mut discs, &disc, x, y - 1, 0, -1);
        update(&mut discs, &disc, x + 1, y + 1, 1, 1);
        update(&mut discs, &disc, x - 1, y - 1, -1, -1);
        update(&mut discs, &disc, x + 1, y - 1, 1, -1);
        update(&mut discs, &disc, x - 1, y + 1, -1, 1);
        self.discs.replace(discs);
    }
}

#[cfg(test)]
mod tests {
    use super::Reversi;

    #[test]
    fn reversi() {
        let r = Reversi::new();
        r.player1_id.set(1);
        r.player2_id.set(2);
        r.init();
        r.set_disc(1, 0, 4).unwrap();
        r.set_disc(2, 2, 4).unwrap();
        r.set_disc(1, 2, 3).unwrap();
        r.set_disc(2, 1, 4).unwrap();
        r.set_disc(1, 5, 4).unwrap();
        r.set_disc(2, 6, 4).unwrap();
        r.set_disc(1, 7, 4).unwrap();
        r.set_disc(2, 2, 5).unwrap();
        for r in r.discs.into_inner().iter() {
            println!("{:?}", r);
        }
    }
}
