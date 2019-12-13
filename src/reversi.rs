use serde::{Deserialize, Serialize};
use std::cell::{Cell, RefCell};

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct States {
    pub states: Vec<Vec<u8>>,
}

impl States {
    pub fn get_json(&self) -> String {
        serde_json::to_string(&self).unwrap()
    }
}

#[derive(Debug)]
pub struct Reversi {
    pub player1_id: Cell<usize>,
    pub player2_id: Cell<usize>,
    pub states: RefCell<States>,
}

impl Reversi {
    pub fn new() -> Self {
        Self {
            player1_id: Cell::new(0),
            player2_id: Cell::new(0),
            states: RefCell::new(States {
                states: vec![vec![]],
            }),
        }
    }

    pub fn init(&self) {
        self.states.replace(States {
            states: vec![
                vec![0, 0, 0, 0, 0, 0, 0, 0],
                vec![0, 0, 0, 0, 0, 0, 0, 0],
                vec![0, 0, 0, 0, 0, 0, 0, 0],
                vec![0, 0, 0, 1, 2, 0, 0, 0],
                vec![0, 0, 0, 2, 1, 0, 0, 0],
                vec![0, 0, 0, 0, 0, 0, 0, 0],
                vec![0, 0, 0, 0, 0, 0, 0, 0],
                vec![0, 0, 0, 0, 0, 0, 0, 0],
            ],
        });
    }

    pub fn set_disc(&self, id: usize, _x: usize, _y: usize) {
        let id1 = self.player1_id.get();
        let id2 = self.player2_id.get();
        let mut disc = 0;
        if id == id1 {
            disc = 1;
        }
        if id == id2 {
            disc = 2;
        }
        if disc != 0 {
            let mut states = self.states.clone();
            states.get_mut().states[_y][_x] = disc;
            self.states.replace(states.into_inner());
        }
    }

    pub fn get_states(&self) -> Vec<Vec<u8>> {
        let states = self.states.clone();
        states.into_inner().states
    }
}

#[cfg(test)]
mod tests {
    use super::Reversi;
    use super::States;
    use std::cell::{Cell, RefCell};

    #[test]
    fn reversi() {
        let r = Reversi {
            player1_id: Cell::new(1),
            player2_id: Cell::new(2),
            states: RefCell::new(States {
                states: vec![vec![]],
            }),
        };
        r.init();
        r.set_disc(2, 1, 1);
        r.set_disc(1, 2, 1);
    }
}
